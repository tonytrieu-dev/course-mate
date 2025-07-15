import { supabase } from './supabaseClient';

const SIGNED_URL_DURATION = 31536000; // 1 year

export const fileService = {
  async uploadSyllabus(file, classData) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const fileName = `${classData.id}/${Date.now()}_${file.name}`;
    
    // Upload file to storage
    const { data, error } = await supabase.storage
      .from("class-materials")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type || 'application/pdf',
        fileMetadata: { owner: user.id },
      });

    if (error) throw error;

    // Get signed URL
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from("class-materials")
      .createSignedUrl(fileName, SIGNED_URL_DURATION);

    if (signedUrlError) throw signedUrlError;

    // Delete existing syllabus if any
    if (classData.syllabus?.path) {
      await supabase
        .from("class_syllabi")
        .delete()
        .eq("class_id", classData.id);
    }

    // Insert new syllabus record
    const { data: syllabusRecord, error: insertError } = await supabase
      .from("class_syllabi")
      .insert({
        class_id: classData.id,
        name: file.name,
        path: fileName,
        url: signedUrlData.signedUrl,
        owner: user.id,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Invoke embed-file function
    const { error: functionError } = await supabase.functions.invoke('embed-file', {
      body: { record: syllabusRecord },
    });

    if (functionError) {
      console.error('Error invoking embed-file function for syllabus:', functionError);
    }

    return syllabusRecord;
  },

  async uploadClassFile(file, classData) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const fileName = `${classData.id}/files/${Date.now()}_${file.name}`;
    
    // Upload file to storage
    const { data, error } = await supabase.storage
      .from("class-materials")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type || 'application/octet-stream',
        fileMetadata: { owner: user.id },
      });

    if (error) throw error;

    // Get signed URL
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from("class-materials")
      .createSignedUrl(fileName, SIGNED_URL_DURATION);

    if (signedUrlError) throw signedUrlError;

    // Insert file record
    const { data: fileRecord, error: insertError } = await supabase
      .from("class_files")
      .insert({
        class_id: classData.id,
        name: file.name,
        path: fileName,
        type: file.type,
        size: file.size,
        url: signedUrlData.signedUrl,
        owner: user.id,
        uploaded_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Invoke embed-file function
    const { error: functionError } = await supabase.functions.invoke('embed-file', {
      body: { record: fileRecord },
    });

    if (functionError) {
      console.error('Error invoking embed-file function:', functionError);
    }

    return fileRecord;
  },

  async deleteFile(filePath, classId) {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      throw new Error("Authentication error: " + (userError?.message || "User not authenticated"));
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from("class-materials")
      .remove([filePath]);

    if (storageError) throw storageError;

    // Delete from database
    const { error: fileDbError } = await supabase
      .from("class_files")
      .delete()
      .eq("path", filePath);

    if (fileDbError) throw fileDbError;

    // Get remaining files
    const { data: classFiles, error: classFilesError } = await supabase
      .from("class_files")
      .select("*")
      .eq("class_id", classId)
      .order("uploaded_at", { ascending: false });

    if (classFilesError) throw classFilesError;

    return classFiles || [];
  },

  async deleteSyllabus(syllabusPath, classId) {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      throw new Error("Authentication error: " + (userError?.message || "User not authenticated"));
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from("class-materials")
      .remove([syllabusPath]);

    if (storageError) throw storageError;

    // Delete from database
    const { error: syllabusDbError } = await supabase
      .from("class_syllabi")
      .delete()
      .eq("class_id", classId);

    if (syllabusDbError) throw syllabusDbError;
  },

  async getClassData(classId) {
    // Fetch latest syllabus
    const { data: syllabusArr } = await supabase
      .from("class_syllabi")
      .select("*")
      .eq("class_id", classId)
      .order("uploaded_at", { ascending: false })
      .limit(1);

    // Fetch latest files
    const { data: filesArr } = await supabase
      .from("class_files")
      .select("*")
      .eq("class_id", classId)
      .order("uploaded_at", { ascending: false });

    return {
      syllabus: syllabusArr && syllabusArr.length > 0 ? syllabusArr[0] : null,
      files: filesArr || [],
    };
  }
};